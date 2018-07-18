#!/bin/bash

function commonHelpMessage() {
  echo "Usage: $0 [-s stack-name][-c component][-e envrionment][-d depends][-v vpc stack name][-h]" >&2  echo "  stack-file : The CloudFormation template file" >&2
  echo "  stack-name : The CloudFormation stack name" >&2
  echo "  component :Optional component/service name" >&2
  echo "  environment : The environment to create (or core)" >&2
  echo "  depends : Optional Stack we depend on (fully qualified name)" >&2
  echo "  vpc stack name : The VPC stack name" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":s:c:e:d:v:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      s)
        echo "CloudFormation stack name $OPTARG";STACK="$OPTARG"
        ;;
      c)
        echo "Component/App/Service name $OPTARG";COMPONENT="$OPTARG"
        ;;
      d)
        echo "CloudFormation stack name of dependent stack $OPTARG";DEPENDS="$OPTARG"
        ;;
      e)
        echo "Environment name $OPTARG";ENVIRONMENT="$OPTARG"
        ;;
      v)
        echo "VPC Stack name $OPTARG";VPC_STACK="$OPTARG"
        ;;
      \?)
        echo "Invalid Option -$OPTARG" >&2
        commonHelpMessage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument" >&2
        exit 1
        ;;
      [?])
        commonHelpMessage
        exit 1
        ;;

    esac
  done

  if [ "$STACK" = "" ]; then
    echo "CloudFormation stack name parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$ENVIRONMENT" = "" ]; then
    echo "Environment parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
echo "Set template name"
  CF_TEMPLATE=./infrastructure/stacks/$STACK.json
echo "Set template name $CF_TEMPLATE"
}

parseCommonArguments "$@"

template=$(cat $CF_TEMPLATE)

if [ "$DEPENDS" = "" ]; then
  echo "No dependent stacks"
else
  aws cloudformation describe-stacks --stack-name $DEPENDS

  # >/dev/null 2>&1

  DEPENDS_EXISTS=$?

  if [ $DEPENDS_EXISTS -eq 0 ]; then
    echo "$DEPENDS Stack is ready."
  else
    echo "$DEPENDS Stack is not ready. Stopping! Create the $DEPENDS stack first"
    exit 1
  fi
fi

if [ "$COMPONENT" = "" ]; then
  STACK_NAME=$ENVIRONMENT-$STACK
else
  STACK_NAME=$ENVIRONMENT-$COMPONENT-$STACK
fi

CF_PARAMETERS=$(realpath ./infrastructure/config/$STACK_NAME.json)

echo "Params file $CF_PARAMETERS"

if [ "$VPC_STACK" = "" ]; then
  VPC_STACK=core-vpc
fi

aws cloudformation describe-stacks --stack-name $STACK_NAME

# >/dev/null 2>&1

EXISTS=$?

if [ $EXISTS -eq 0 ]; then
  echo "Stack exists"
  echo "Updating $STACK_NAME stack from $CF_TEMPLATE template"
  aws cloudformation update-stack --stack-name $STACK_NAME --template-body "$template" --parameters "file:///$CF_PARAMETERS" --capabilities CAPABILITY_IAM
  UPDATING=$?
  if [ $UPDATING -eq 0 ]; then
    echo "Performing stack update"
  else
    echo "No updates needed. Stack or parameters may not have changed"
    exit 0
  fi

  aws cloudformation wait stack-update-complete --stack-name $STACK_NAME

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$STACK_NAME failed to update"
    exit 1
  else
    echo "$STACK_NAME updated successfully"
  fi
else
  echo "Stack does not exist"
  echo "Creating $STACK_NAME stack from $CF_TEMPLATE template"
  aws cloudformation create-stack --stack-name $STACK_NAME --template-body "$template" --parameters "file:///$CF_PARAMETERS"  --capabilities CAPABILITY_IAM

  aws cloudformation wait stack-create-complete --stack-name $STACK_NAME

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$STACK_NAME failed to create"
    exit 1
  else
    echo "$STACK_NAME created successfully"
  fi
fi
