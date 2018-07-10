#!/bin/bash

function commonHelpMessage() {
  echo "Usage: $0 [-f stack-file][-h]" >&2
  echo "  stack-file : The CloudFormation template file" >&2
  echo "  stack-name : The CloudFormation VPC stack name" >&2
  echo "  environment : The environment to create" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":f:s:e:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      f)
        echo "CloudFormation template $OPTARG";CF_TEMPLATE="$OPTARG"
        ;;
      s)
        echo "CloudFormation stack name $OPTARG";STACK_NAME="$OPTARG"
        ;;
      e)
        echo "Environment name $OPTARG";ENVIRONMENT="$OPTARG"
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

  if [ "$CF_TEMPLATE" == "" ]; then
    echo "CloudFormation template parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$STACK_NAME" = "" ]; then
    echo "CloudFormation stack name parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$ENVIRONMNET" = "0" ]; then
    echo "Environment parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
}

parseCommonArguments "$@"

template=$(cat $CF_TEMPLATE)

aws cloudformation describe-stacks --stack-name $STACK_NAME

# >/dev/null 2>&1

VPC_EXISTS=$?

if [ $VPC_EXISTS -eq 0 ]; then
  echo "Using existing VPC stack, $STACK_NAME"
else
  echo "VPC STack is not ready. Stoppping! Create the $STACK_NAME stack first"
  exit 1
fi

aws cloudformation describe-stacks --stack-name $ENVIRONMENT-networking

# >/dev/null 2>&1

NET_EXISTS=$?

if [ $NET_EXISTS -eq 0 ]; then
  echo "Using existing VPC stack, $ENVIRONMENT-networking"
else
  echo "Environment Network Stack is not ready. Stopping! Create the $ENVIRONMENT-networking stack first"
  exit 1
fi

aws cloudformation describe-stacks --stack-name $ENVIRONMENT-alb

# >/dev/null 2>&1

ALB_EXISTS=$?

if [ $ALB_EXISTS -eq 0 ]; then
  echo "Using existing VPC stack, $ENVIRONMENT-alb"
else
  echo "Environment Network Stack is not ready. Stopping! Create the $ENVIRONMENT-alb stack first"
  exit 1
fi

aws cloudformation describe-stacks --stack-name $ENVIRONMENT-ecs

# >/dev/null 2>&1

ECS_EXISTS=$?

if [ $ECS_EXISTS -eq 0 ]; then
  echo "Using existing ECS stack, $ENVIRONMENT-ecs"
else
  echo "Environment ECS Stack is not ready. Stopping! Create the $ENVIRONMENT-ecs stack first"
  exit 1
fi

aws cloudformation describe-stacks --stack-name $ENVIRONMENT-service

# >/dev/null 2>&1

EXISTS=$?

if [ $EXISTS -eq 0 ]; then
  echo "Stack exists"
  echo "Updating $ENVIRONMENT-ecs stack from $CF_TEMPLATE template"
  aws cloudformation update-stack --stack-name $ENVIRONMENT-service --template-body "$template" --parameters ParameterKey=VPCStackName,ParameterValue=$STACK_NAME ParameterKey=EnvironmentType,ParameterValue=$ENVIRONMENT ParameterKey=ContainerCpu,ParameterValue=256 ParameterKey=ContainerMemory,ParameterValue=512 ParameterKey=ImageUrl,ParameterValue=nudj/web ParameterKey=ServiceName,ParameterValue=web ParameterKey=ContainerPort,ParameterValue=80 ParameterKey=DesiredCount,ParameterValue=1 --capabilities CAPABILITY_IAM
  UPDATING=$?
  if [ $UPDATING -eq 0 ]; then
    echo "Performing stack update"
  else
    echo "No updates needed. Stack or parameters may not have changed"
    exit 0
  fi

  aws cloudformation wait stack-update-complete --stack-name $ENVIRONMENT-service

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$ENVIRONMENT-ecs failed to update"
    exit 1
  else
    echo "$ENVIRONMENT-ecs updated successfully"
  fi
else
  echo "Stack does not exist"
  echo "Creating $ENVIRONMENT-service stack from $CF_TEMPLATE template"
  aws cloudformation create-stack --stack-name $ENVIRONMENT-service --template-body "$template" --parameters ParameterKey=VPCStackName,ParameterValue=$STACK_NAME ParameterKey=EnvironmentType,ParameterValue=$ENVIRONMENT ParameterKey=ContainerCpu,ParameterValue=256 ParameterKey=ContainerMemory,ParameterValue=512 ParameterKey=ImageUrl,ParameterValue=nudj/web ParameterKey=ServiceName,ParameterValue=web ParameterKey=ContainerPort,ParameterValue=80 ParameterKey=DesiredCount,ParameterValue=1 --capabilities CAPABILITY_IAM

  aws cloudformation wait stack-create-complete --stack-name $ENVIRONMENT-service

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$ENVIRONMENT-service failed to create"
    exit 1
  else
    echo "$ENVIRONMENT-service created successfully"
  fi
fi
