#!/bin/bash

AWS_ACCOUNT_ID=470250561590
AWS_REGION=eu-west-1

function commonHelpMessage() {
  echo "Usage: $0 [-c component][-e envrionment][-v vpc stack name][-h]" >&2  echo "  stack-file : The CloudFormation template file" >&2
  echo "  component :Optional component/service name" >&2
  echo "  environment : The environment to create (or core)" >&2  echo "  vpc stack name : The VPC stack name" >&2
  echo "  vpc stack name : The VPC stack name" >&2
}

function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":c:e:v:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      c)
        echo "Component/App/Service name $OPTARG";COMPONENT="$OPTARG"
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

  if [ "$ENVIRONMENT" = "" ]; then
    echo "Environment parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
}

function generateContainerDefinition() {
  template="[{\"dnsSearchDomains\": [],\"environment\": [{\"name\": \"ENVKEY\",\"value\": \"foo\"}],\"name\": \"${COMPONENT}-${ENVIRONMENT}\",\"links\": [],\"mountPoints\": [],\"image\": \"${IMAGE_URL}\",\"logConfiguration\": {\"logDriver\": \"awslogs\",\"options\": {\"awslogs-region\": \"eu-west-1\",\"awslogs-stream-prefix\": \"ecs-content\",\"awslogs-group\": \"ECSLogGroup-${ENVIRONMENT}-${COMPONENT}-service\"}},\"dockerLabels\": {},\"essential\": true,\"portMappings\": [{\"protocol\": \"tcp\",\"containerPort\": ${PORT},\"hostPort\": ${PORT}}],\"dnsServers\": [],\"dockerSecurityOptions\": [],\"entryPoint\": [],\"ulimits\": [],\"memory\": ${MEMORY},\"command\": [],\"extraHosts\": [],\"cpu\": ${CPU},\"volumesFrom\":[]}]"
}

parseCommonArguments "$@"

if [ "$COMPONENT" = "" ]; then
  STACK_NAME=$ENVIRONMENT-service
else
  STACK_NAME=$ENVIRONMENT-service-$COMPONENT
fi

CF_PARAMETERS=$(realpath ./infrastructure/config/$STACK_NAME.json)

echo "Params file $CF_PARAMETERS"
parameters=$(cat $CF_PARAMETERS)

echo $parameters

PORT=$(echo ${parameters} | jq '.[] | select(.ParameterKey == "ContainerPort").ParameterValue'  | tr -d '"')
CPU=$(echo ${parameters} | jq '.[] | select(.ParameterKey == "ContainerCpu").ParameterValue'  | tr -d '"')
MEMORY=$(echo ${parameters} | jq '.[] | select(.ParameterKey == "ContainerMemory").ParameterValue'  | tr -d '"')
IMAGE_URL=$(echo ${parameters} | jq '.[] | select(.ParameterKey == "ImageUrl").ParameterValue'  | tr -d '"')

generateContainerDefinition "$ENVIRONMENT" $PORT $MEMORY $CPU "$COMPONENT" "$VPC_STACK" $IMAGE_URL

exports=$(aws cloudformation list-exports)

roleArn=$(echo ${exports} | jq ".Exports[] | select(.Name == '$VPC_STACK-$ENVIRONMENT-ECSTaskExecutionRoleArn').Value" | tr -d '"')

aws ecs register-task-definition --execution-role-arn $roleArn --cpu $CPU --memory $MEMORY --network-mode awsvpc --requires-compatibilities "FARGATE" --family "$VPC_STACK-$ENVIRONMENT-$COMPONENT" --container-definitions "$template" --region $AWS_REGION

aws ecs update-service --force-new-deployment --cluster "$VPC_STACK-$ENVIRONMENT" --region $AWS_REGION --service $(aws ecs list-services --cluster "$VPC_STACK-$ENVIRONMENT" --region $AWS_REGION | jq '.serviceArns[]' | grep "$COMPONENT-$ENVIRONMENT" | sed 's|arn:aws:ecs:$AWS_REGION:$AWS_ACCOUNT_ID:service\/||' | sed 's|\"||g') --task-definition "$VPC_STACK-$ENVIRONMENT-$COMPONENT"
